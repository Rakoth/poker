class FoldAction < Action
  def initialize receiver
    super receiver
  end

  def kind
    return 0
  end

  def player_influence
    player.update_attribute :state, player.class::STATE[:pass]
    super
  end
end
