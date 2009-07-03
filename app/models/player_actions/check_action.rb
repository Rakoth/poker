class PlayerActions::CheckAction < PlayerActions::Action

	def kind
		CHECK
	end

  def can_perform?
    player.has_called?
  end
end
