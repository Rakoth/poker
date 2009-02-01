class PlayerObserver < ActiveRecord::Observer

  def after_create player
    UserBalanceLog.create(
      :user => player.user,
      :direction => 'out',
      :value => player.game.kind.pay_for_play,
      :comment => "Присоединился к игре '#{player.game.kind.title}'"
    )
  end

  def before_destroy player
    UserBalanceLog.create(
      :user => player.user,
      :direction => 'in',
      :value => player.game.kind.pay_for_play,
      :comment => "Покинул игру '#{player.game.kind.title}' до старта"
    ) if player.game.wait?
  end
end
