module StackAffectedAction
  def player_influence
    StackManipulator.take_chips value + player.for_call, player
  end
end