class FoldAction < Action
  def initialize receiver
    @kind = 0
    super receiver
  end

  def player_influence
    @player_params[:state] = player.class::STATE[:pass]
  end
end
