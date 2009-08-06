module DistributionSystem
	def next_stage?
		players.all?(&:ready_for_next_stage?)
	end

  def next_stage!
		logger.info 'STARTED next_stage!'
		Player.update_all({:act_in_this_round => false}, {:game_id => id})
    if on_preflop?
      show_flop!
    elsif on_flop?
      show_turn!
    elsif on_turn?
      show_river!
    else
			# не должно быть ситуации, в которой выполняется это условие
      raise "final_distribution! should be activated before the next_stage!"
    end
  end

	def final_distribution?
		one_winner? or allin_and_call? or (on_river? and next_stage?)
	end

	# метод разделяет банк игры между победителями раздачи,
	# которые определяются самим методом исходя из карт игроков
  def final_distribution!
		logger.info 'STARTED final_distribution!'

		update_attribute :show_previous_final, !one_winner?
		# если торги продолжать невозможно, но показаны еще не все карты на столе
		deal_remained_cards! if allin_and_call?
		# сохраним текущее значение стэка для каждого игрока
		players.each_index{|i| players[i].previous_stack = players[i].stack}
		
		generate_groups!
		prepare_groups!
		# сохранить все изменения
    calculate_groups.flatten.each(&:save)

		exclude_losed_players!
		# переходим к новой раздаче или заканчиваем игру
	  new_distribution!
  end

	def continue_distribution!
		logger.info "STARTED continue_distribution!"
		next_stage! if next_stage?
		next_player_temp = next_player
		self.active_player = next_player_temp
		unless next_player_temp.active?
			if next_player_temp.absent_and_must_call?
				next_player_temp.auto_fold!
			else # allin или absent
				next_player_temp.auto_check!
			end
		end
	end

	private

	def generate_groups!
		# разделить игроков на сделавших пас и не сделавших
		folds = players.select(&:fold?)
		winners = players - folds

		# разделить игроков на группы по значению карт
		# отсортировать группы в порядке убывания по силе комбинаций карт игроков в группе
		@groups = winners.group_by(&:full_hand).sort_by{ |g| g[0] }.reverse

		# выделить сделавших пасс игроков в последнюю группу, не указывать в комбинации карт группы их карты
		@groups.push [nil, folds] unless folds.empty?
	end

	def prepare_groups!
		# делаем необходимые для определения выйгрыша каждой группы подготовительные операции
    @groups.map! do |g|
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
	end

	def calculate_groups
		# для каждой группы определить ее выйгрыш
		# проходя по массиву групп по очереди (от более сильных рук к более слабым)
    @groups.map do |g|
      max, chips_sum = g[0], 0
			# для каждого игрока в каждой группе
      @groups.map! do |group|
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
	end

	def exclude_losed_players!
		players.reload
		players.each { |player| player.lose! if player.has_empty_stack? }
		players.reload
	end

  def before_distribution
		logger.info 'STARTED before_distribution'
		new_blind_position = next_blind_position
    update_attributes(
			:current_bet => 0,
			:blind_position => new_blind_position,
			:active_player_id => get_first_player_from(new_blind_position),
			:deck => Poker::Deck.new.shuffle,
			:flop => nil,
			:turn => nil,
			:river => nil,

			#TODO сохранять предыдущие значения карт, только если установлен флаг show_previous_final
			:previous_flop => Poker::Hand.new(flop),
			:previous_turn => Poker::Hand.new(turn),
			:previous_river => Poker::Hand.new(river)
		)
    players.each do |player|
			player.activate! unless player.active?
			player.update_attributes(
				:in_pot => 0,
				:for_call => 0,
				:previous_hand => (player.open_hand? ? player.hand : nil)
			) unless 0 == player.in_pot and 0 == player.for_call and !player.open_hand?
    end
		# TODO сделать одним запросом
		actions.each(&:destroy)
  end

	def start_distribution!
		logger.info 'STARTED start_distribution!'
		before_distribution
		next_blind_level
		take_blinds!
		deal_hands!
	end
	
  def deal_flop!
		update_attribute :flop, Poker::Hand.new(deck.next(3))
  end

  def deal_turn!
		update_attribute :turn, Poker::Hand.new(deck.next(1))
  end

  def deal_river!
		update_attribute :river, Poker::Hand.new(deck.next(1))
  end

  def deal_hands!
    players.each do |player|
      player.update_attribute :hand, Poker::Hand.new(deck.next(2))
    end
  end

	def deal_remained_cards!
		if on_preflop?
			update_attributes(
				:flop => Poker::Hand.new(deck.next(3)),
				:turn => Poker::Hand.new(deck.next(1)),
				:river => Poker::Hand.new(deck.next(1))
			)
		elsif on_flop?
			update_attributes(
				:turn => Poker::Hand.new(deck.next(1)),
				:river => Poker::Hand.new(deck.next(1))
			)
		elsif on_turn?
			deal_river!
		else
			# ничего не делаем
		end
	end
end