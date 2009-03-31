module DistributionSystem
	def goto_next_stage
		logger.info 'STARTED next_stage'
		if all_pass?
      final_distribution!
    elsif next_stage?
      next_stage!
		else
			# do nothing
    end
  end

	protected

  def before_distribution
		logger.info 'STARTED before_distribution'
    update_attributes :current_bet => 0, :blind_position => next_blind_position, :deck => Poker::Deck.new
    players.each do |player|
      if player.has_empty_stack?
        player.lose!
      else
				player.activate!
        player.update_attributes :in_pot => 0, :for_call => 0
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
	
  def prepare_flop!
  end

  def prepare_turn!
  end

  def prepare_river!
  end

  def hands_deal!
    players.each do |player|
      player.update_attribute :hand, deck.deal(1, 2).first
    end
  end

  def final_distribution!
		logger.info 'STARTED final_distribution!'
    groups = players.group_by(&:rank).sort_by{ |g| g[0] }.reverse.map do |g|
      group, max = g[1], 0
      general_in_pot = group.inject(0){|s, p| s + p.in_pot}
      if general_in_pot > 0
        max = group.first.in_pot
        group.map! do |player|
          max = player.in_pot if player.in_pot > max
          player.persent = ((100 * player.in_pot / general_in_pot).to_f.round) / 100
          player
        end
      end
      [max, group]
    end
    calculated_groups = groups.map do |g|
      max, chips_sum = g[0], 0
      groups.map! do |group|
        group[1].map! do |player|
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
      g[1].map{ |player| player.stack += (chips_sum * player.persent).round; player}
    end
    calculated_groups.flatten.each{ |player| player.save}
  end
end