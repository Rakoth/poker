class Player < ActiveRecord::Base

  STATE = {:active => 'active', :allin => 'allin', :pass => 'pass', :away => 'away', :pass_away => 'pass_away'}

  validates_presence_of :user_id, :game_id, :sit, :stack

  belongs_to :user
  belongs_to :game, :counter_cache => :players_count
  has_many :actions

  before_destroy :return_money, :destroy_game_if_last, :give_prize
  before_create :take_money

  attr_writer :persent # процент выйгрыша
  def persent
    @persent ||= 0
  end

  def act! params
    hash_params = {:player => self, :game => game}
    hash_params[:value] = params[:value] unless params[:value].nil?
    action = case params[:kind]
    when 0:
      FoldAction.new hash_params
    when 1:
      CheckAction.new hash_params
    when 2:
      CallAction.new hash_params
    when 3:
      BetAction.new hash_params
    when 4:
      RaiseAction.new hash_params
    end
    action.execute
  end

  def active?
    STATE[:active] == state
  end
  
  def away?
    STATE[:away] == state or STATE[:pass_away] == state
  end

  def pass_away?
    STATE[:pass_away] == state
  end

  def pass?
    STATE[:pass] == state or STATE[:pass_away] == state
  end

  def has_called?
    0 == for_call
  end

  def must_call?
    for_call > 0
  end

  def stack_empty?
    0 == stack
  end

  def rank
    if pass?
      -1
    else
      hand.to_i
    end
  end

  def do_pass_away!
    update_attribute :state => STATE[:pass_away]
  end

  protected

  def give_prize
    #TODO отдать выйгранные деньги юзеру
  end
  
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
