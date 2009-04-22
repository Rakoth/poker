class Actions::CheckAction < Action
	KIND = 1

  def can_perform?
    player.has_called?
  end
end
