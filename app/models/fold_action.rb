class FoldAction < Action
  def kind
    return 0
  end

  def player_influence
    player.fold!
    super
  end
end
