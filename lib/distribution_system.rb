module DistributionSystem
	def goto_next_stage
		logger.info 'STARTED next_stage'
		if all_pass?
      final_distribution!
    elsif next_stage?
      next_stage!
		else
			# ничего не делать, т.к. еще не закончены торги
    end
  end

	private

  def before_distribution
		logger.info 'STARTED before_distribution'
		new_blind_position = next_blind_position
    update_attributes(
			:current_bet => 0,
			:blind_position => new_blind_position,
			:active_player_id => get_first_player_from(new_blind_position),
			:deck => Poker::Deck.new.shuffle
		)
    players.each do |player|
      if player.has_empty_stack?
        player.lose!
      else
				logger.info 'START'
				player.activate! unless player.active?
        player.update_attributes :in_pot => 0, :for_call => 0 unless 0 == player.in_pot and 0 == player.for_call
				logger.info 'END'
      end
    end
  end

	def next_stage?
		players.all? { |p| p.ready_for_next_stage? }
	end

  def next_stage!
		logger.info 'STARTED goto_next_stage!'
    if on_preflop?
      show_flop!
    elsif on_flop?
      show_turn!
    elsif on_turn?
      show_river!
    else
      final_distribution!
    end
  end

	def start_distribution!
		logger.info 'STARTED start_distribution!'
    before_distribution
    next_blind_level
    take_blinds!
    hands_deal!
	end
	
  def deal_flop!
		update_attribute :flop, deck.next(3)
  end

  def deal_turn!
		update_attribute :turn, deck.next(1)
  end

  def deal_river!
		update_attribute :river, deck.next(1)
  end

  def hands_deal!
    players.each do |player|
      player.update_attribute :hand, Poker::Hand.new(deck.next(2))
    end
  end

	# метод разделяет банк игры между победителями раздачи,
	# которые определяются самим методом исходя из карт игроков
  def final_distribution!
		logger.info 'STARTED final_distribution!'
		# выделить не сделавших пасс игроков
		winners = players.select {|player| !player.fold?}

		# разделить игроков на группы по значению карт
		# отсортировать группы в порядке убывания по силе комбинаций карт игроков в группе
		groups = winners.group_by(&:full_hand).sort_by{ |g| g[0] }.reverse

		# выделить сделавших пасс игроков в последнюю группу, не указывать в комбинации карт группы их карты
		folds = players.select {|player| player.fold?}
		groups.push [nil, folds] unless folds.empty?

		# делаем необходимые для определения выйгрыша каждой группы подготовительные операции
    groups.map! do |g|
			# если это не последняя группа(сделавших пасс)
			unless g[0].nil?
				group, max = g[1], 0
				#! следующие два цикла можно объединить в один
				# определяем максимум из ставок игроков группы
				max = group.first.in_pot
				group.each {|player| max = player.in_pot if player.in_pot > max}
				# для каждого игрока устанавливаем процент его выйгрыша относительно общего выйгрыша группы
				general_in_pot = group.inject(0){|s, p| s + p.in_pot}
				if general_in_pot > 0
					group.map! do |player|
						player.persent = ((100 * player.in_pot / general_in_pot).to_f.round) / 100
						player
					end
				end
				[max, group]
			else
				[0, g[1]]
      end
    end
		# для каждой группы определить ее выйгрыш
		# проходя по массиву групп по очереди (от более сильных рук к более слабым)
    calculated_groups = groups.map do |g|
      max, chips_sum = g[0], 0
			# для каждого игрока в каждой группе
      groups.map! do |group|
        group[1].map! do |player|
					# снимаем с него минимум из поставленных им фишек и максимума ставки для текущей группы
					# и прибавляем это значения к выйгрышу группы
          if player.in_pot > max
            chips_sum += max
            player.in_pot -= max
          else
            chips_sum += player.in_pot
            player.in_pot = 0
          end
          player
        end
        group
      end
			# разделить выйгрыш группы на членов группы согласно их процентам
      g[1].map{ |player| player.stack += (chips_sum * player.persent).round; player}
    end
		# сохранить все изменения
    calculated_groups.flatten.each{ |player| player.save}
  end
end