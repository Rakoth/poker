class CallAction < Action
  def initialize receiver
    super receiver
  end

  def kind
    return 2
  end

  def can_perform?
    player.must_call?
  end

  def player_influence
    StackManipulator.take_chips player, value
    super
  end
end
