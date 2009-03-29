class BetAction < CallAction
  def initialize receiver, value
    @kind ||= 3
    @value = value
    super receiver
  end

  def can_perform?
    @value = game.minimal_bet if 0 == @value
    return (player.stack >= player.for_call + value and
      value >= game.minimal_bet and game.current_bet == game.blind_size)
  end

  def game_influence
    game_params[:current_bet] = game.current_bet + value
  end

  def other_players_influence
    @need_update_all = true
  end
end
