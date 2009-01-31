module GamesHelper

  def human_status status
    case status
      when 'wait'
        "Ожидание игроков"
      when 'start'
        "Игра началась"
      when 'fin'
        "Игра окончена"
      when 'error'
        "Ошибка в игре"
      else
        "Чета со статусом косяг"
    end
  end

  def players_stat game
    "#{game.players_count} / #{game.kind.max_players}"
  end

  def levels_stat kind
    "#{kind.min_level} - #{kind.max_level}"
  end

end
