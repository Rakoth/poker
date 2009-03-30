class Player < ActiveRecord::Base

  STATE = {:active => 'active', :allin => 'allin', :pass => 'pass', :away => 'away', :pass_away => 'pass_away'}

  validates_presence_of :user_id, :game_id, :sit, :stack

  belongs_to :user
  belongs_to :game, :counter_cache => :players_count
  has_many :actions

  before_create :take_money
	after_create :start_game, :if => lambda {|player| player.game.full_of_players?}
  before_destroy :return_money, :if => lambda {|player| player.game.waited?}
	after_destroy :give_prize, :unless => lambda {|player| player.game.waited?}
	after_destroy :destroy_game, :if => lambda {|player| player.game.empty_players_set?}
	
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

	def ready_for_next_stage?
		has_called? or fold?
	end

  def active?
    STATE[:active] == status
  end
  
  def away?
    STATE[:away] == status or STATE[:pass_away] == status
  end

  def pass_away?
    STATE[:pass_away] == status
  end

  def pass?
    STATE[:pass] == status or STATE[:pass_away] == status
  end
	alias_method :fold?, :pass?

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
    update_attribute :status => STATE[:pass_away]
  end

  protected

  def give_prize
    #TODO отдать выйгранные деньги юзеру
  end
  
  def return_money
    user.update_attribute(:cash, user.cash + game.type.pay_for_play)
  end

  def take_money
    user.update_attribute(:cash, user.cash - game.type.pay_for_play)
  end

  def destroy_game
    game.destroy
  end

	def start_game
		game.start!
	end

end
