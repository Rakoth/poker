module GamesHelper
  def players_stat game
    "#{game.players_count} / #{game.type.max_players}"
  end

	def human_status game
		case game.status
		when Game::STATUS[:waited]
			content_tag :span, t('helpers.games.status.wait'), :class => 'waited_game'
		when Game::STATUS[:finished]
			content_tag :span, t('helpers.games.status.finish'), :class => 'finished_game'
		else
			content_tag :span, t('helpers.games.status.start'), :class => 'started_game'
		end
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
		[ {:name => 'fold',  :kind => PlayerActions::Base::FOLD,  :value => false},
			{:name => 'check', :kind => PlayerActions::Base::CHECK, :value => false},
			{:name => 'call',  :kind => PlayerActions::Base::CALL,  :value => false},
			{:name => 'bet',   :kind => PlayerActions::Base::BET,   :value => true},
			{:name => 'raise', :kind => PlayerActions::Base::RAISE, :value => true} ]
	end
end
