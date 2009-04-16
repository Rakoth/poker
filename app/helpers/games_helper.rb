module GamesHelper
  def players_stat game
    "#{game.players_count} / #{game.type.max_players}"
  end

  def levels_stat type
    "#{type.min_level} - #{type.max_level}"
  end

	def player_window_position game_type_id, sit
		case game_type_id
			when 1:
				"top:#{100}px;left:#{200 * sit}px"
			when 2:
				"top:#{100}px;left:#{200 * sit}px"
			when 3:
				"top:#{100}px;left:#{200 * sit}px"
		end
	end

	def sits_element_id element_name, player_sit
		"#{element_name}_#{player_sit}"
	end
end
