module StackAffectedAction
  def player_influence
    StackManipulator.take_chips player, value
  end
end