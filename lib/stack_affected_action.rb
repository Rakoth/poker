module StackAffectedAction
  def player_influence
    StackManipulator.take_chips value, player
  end
end