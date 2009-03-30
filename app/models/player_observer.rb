class PlayerObserver < ActiveRecord::Observer

  def after_create player
    UserBalanceAction.out(player.user, player.game.type.pay_for_play, player.game.type.title)
  end

  def before_destroy player
    UserBalanceAction.in(player.user, player.game.type.pay_for_play, player.game.type.title) if player.game.waited?
  end
end
