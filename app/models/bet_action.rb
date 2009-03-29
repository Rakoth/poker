class BetAction < CallAction
  def initialize receiver, value
    @value = (0 == value ? game.minimal_bet : value)  
    super receiver
  end

  def kind
    return 3
  end

  def can_perform?
    return (player.stack >= player.for_call + value and
      value >= game.minimal_bet and game.current_bet == game.blind_size)
  end

  def game_influence
    game_params[:current_bet] = game.current_bet + value
    super
  end
end
