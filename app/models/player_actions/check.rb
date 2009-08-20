class PlayerActions::Check < PlayerActions::Base
	def kind
		CHECK
	end

  def can_perform?
    player.has_called?
  end
end
