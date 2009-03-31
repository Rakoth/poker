class StackManipulator
  def self.take_chips player, value
    player.reload
    stake_size = player.for_call + value
    if stake_size >= player.stack
      player.i_am_allin!
      stake_size = player.stack
    end
    player.stack = player.stack - stake_size
    player.in_pot = player.in_pot + stake_size
    player.for_call = 0
    Player.update_all "for_call = for_call + #{value}", ["game_id = ? AND id != ?", player.game_id, player.id] if value > 0
    player.save
  end
end