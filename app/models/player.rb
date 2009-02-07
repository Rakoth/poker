class Player < ActiveRecord::Base

  validates_presence_of :user_id, :game_id, :sit, :stack

  belongs_to :user
  belongs_to :game, :counter_cache => :players_count

  before_destroy :return_money, :destroy_game_if_last
  before_create :take_money

  # named_scope :current, lambda { |game_id, user_id| { :conditions => ["game_id = ? AND user_id = ?", game_id, user_id] } }


  protected

  def return_money
    user.update_attribute(:cash, user.cash + game.type.pay_for_play) if game.wait?
  end

  def take_money
    user.update_attribute(:cash, user.cash - game.type.pay_for_play)
  end

  def destroy_game_if_last
    game.destroy if 1 == game.players_count and Game.count(:conditions => ['status = "wait" AND type_id = ?', game.type_id]) > 1
  end

end
