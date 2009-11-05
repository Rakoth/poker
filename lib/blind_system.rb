module BlindSystem
  def small_blind_position
    @small_blind_position ||= get_first_player_from blind_position, :out => :sit, :direction => :desc
  end

	def small_blind_size
    @small_blind_size ||= blind_size / 2
  end

  def time_before_next_level
    next_level_time and Time.now < next_level_time ? (next_level_time - Time.now).seconds.round : 0
  end

  def next_blind_level
		if next_level_time and Time.now >= next_level_time
			if new_blind_size = type.get_blind_size(blind_level + 1)
				update_attributes(
					:blind_level => blind_level + 1,
					:blind_size => new_blind_size.value,
					:ante => new_blind_size.ante,
					:next_level_time => Time.now + type.change_level_time.minutes
				)
			else
				update_attribute(:next_level_time, nil)
			end
		end
	end

	def next_blind_position
		blind_position.nil? ? rand(type.max_players) : get_first_player_from(blind_position, :out => :sit)
	end
	
	private

  def player_on_blind
    players.select {|player| player.sit == blind_position}.first
  end

  def player_on_small_blind
    players.select {|player| player.sit == small_blind_position}.first
  end
	
	def init_blinds_system!
		logger.debug 'STARTED init_blinds_system!'
    update_attribute :next_level_time, Time.now + type.change_level_time.minutes
	end


  def take_blinds!
		logger.debug 'STARTED take_blinds!'
    players.map {|player| StackManipulator.take_chips(ante, player)} if ante > 0
    StackManipulator.take_chips small_blind_size, player_on_small_blind
    StackManipulator.take_chips blind_size, player_on_blind
    update_attribute :current_bet, blind_size
  end
end