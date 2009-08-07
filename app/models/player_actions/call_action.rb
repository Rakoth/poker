class PlayerActions::CallAction < PlayerActions::Action
#  def after_initialize
#    self.value = self.player.for_call
#    super
#  end
  

	def kind
		CALL
	end
	
  def can_perform?
    player.must_call?
  end

  include StackAffectedAction
end
