module GamesHelper

  def human_status status
    case status
      when Game::STATUS[:wait]
        "Ожидание игроков"
      when Game::STATUS[:start]
        "Игра началась"
      when Game::STATUS[:fin]
        "Игра окончена"
      when Game::STATUS[:error]
        "Ошибка в игре"
      else
        "Чета со статусом косяг"
    end
  end

  def players_stat game
    "#{game.players_count} / #{game.type.max_players}"
  end

  def levels_stat type
    "#{type.min_level} - #{type.max_level}"
  end

end
