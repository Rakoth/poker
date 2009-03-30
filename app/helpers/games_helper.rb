module GamesHelper
  def players_stat game
    "#{game.players_count} / #{game.type.max_players}"
  end

  def levels_stat type
    "#{type.min_level} - #{type.max_level}"
  end
end
