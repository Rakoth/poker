class PlayerActions::AutoCheckAction < PlayerActions::CheckAction
	KIND = 1

  def can_perform?
    player.has_called?
  end
end