class Actions::CallAction < Action
  def after_initialize
    self.value = self.player.for_call
    super
  end
  
  KIND = 2

  def can_perform?
    player.must_call?
  end

  include StackAffectedAction
end
