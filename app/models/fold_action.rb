class FoldAction < Action
  def kind
    return 0
  end

  def player_influence
    player.update_attribute :state, player.class::STATE[:pass]
    super
  end
end
