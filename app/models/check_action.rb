class CheckAction < Action
  def initialize receiver
    @kind = 1
    super receiver
  end

  def can_perform?
    player.has_called?
  end
end
