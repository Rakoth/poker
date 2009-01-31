class Player < ActiveRecord::Base

  validates_presence_of :user_id, :game_id, :sit, :stack

  belongs_to :user
  belongs_to :game, :counter_cache => :players_count

  before_destroy :return_money
  before_create :get_money

  named_scope :current, lambda { |game_id, user_id| { :conditions => ["game_id = ? AND user_id = ?", game_id, user_id] } }


  protected

  def return_money
    user.update_attribute(:cash, user.cash + game.kind.pay_for_play)
  end

  def get_money
    user.update_attribute(:cash, user.cash - game.kind.pay_for_play)
  end

end
