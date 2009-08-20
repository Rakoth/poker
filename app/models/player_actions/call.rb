class PlayerActions::Call < PlayerActions::Base
	def kind
		CALL
	end
	
  def can_perform?
    player.must_call?
  end

  include StackAffectedAction
end
