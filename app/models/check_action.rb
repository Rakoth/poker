class CheckAction < Action
  def kind
    return 1
  end

  def can_perform?
    player.has_called?
  end
end
