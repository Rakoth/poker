class Actions::RaiseAction < Actions::BetAction
  KIND = 4

  def can_perform?
    return (player.stack >= player.for_call + value and
      player.in_pot + player.for_call + value > game.current_bet)
  end
end
