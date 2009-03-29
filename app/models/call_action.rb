class CallAction < Action
  def after_initialize
    self.value = 0
    super
  end
  
  def kind
    return 2
  end

  def can_perform?
    player.must_call?
  end

  include StackAffectedAction
end
