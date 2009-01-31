class GameType < ActiveRecord::Base
  has_many :games

  named_scope :for_create, :select => 'id, title'

  def pay_for_play
    start_cash + additional_cash
  end

  def prize
    start_cash * max_players
  end

end
