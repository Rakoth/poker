module GamesHelper
  def players_stat game
    "#{game.players_count} / #{game.type.max_players}"
  end

  def levels_stat type
    "#{type.min_level} - #{type.max_level}"
  end

	def sit_position game_type_id, sit
		game_type_id = 1
		case game_type_id
		when 1:
				positions = [[3, 50], [128, 50], [253, 50], [378, 50], [370, 170], [320, 285], [190, 285], [60, 285], [10, 170]]
			"left:#{positions[sit][0]}px;top:#{positions[sit][1]}px;"
		when 2:
				"top:#{100}px;left:#{200 * sit}px;"
		when 3:
				"top:#{100}px;left:#{200 * sit}px;"
		end
	end

	def sits_element_id element_name, player_sit, additional_part = nil
		element_id = "#{element_name}_#{player_sit}"
		element_id << "_#{additional_part}" unless additional_part.nil?
		element_id
	end

	def client_actions
		[ {:name => 'fold',  :kind => PlayerActions::Action::FOLD,  :value => false},
			{:name => 'check', :kind => PlayerActions::Action::CHECK, :value => false},
			{:name => 'call',  :kind => PlayerActions::Action::CALL,  :value => false},
			{:name => 'bet',   :kind => PlayerActions::Action::BET,   :value => true},
			{:name => 'raise', :kind => PlayerActions::Action::RAISE, :value => true} ]
	end
end
