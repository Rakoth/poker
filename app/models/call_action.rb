class CallAction < Action
  def initialize receiver
    @kind ||= 2
    super receiver
  end

  def can_perform?
    player.must_call?
  end

  def player_influence
    @value ||= 0
    stake_size = player.for_call + @value
    if stake_size >= player.stack
      @player_params[:state] = player.class::STATE[:allin]
      stake_size = player.stack
    end
    @player_params[:stack] = player.stack - stake_size
    @player_params[:in_pot] = player.in_pot + stake_size
    @player_params[:for_call] = 0
  end
end
