class Actions::AutoCheckAction < Actions::CheckAction
	KIND = 1

  def can_perform?
    player.has_called?
  end
end