class Player < ActiveRecord::Base
  include AASM
  aasm_initial_state :active
  aasm_column :status

  aasm_state :active
  aasm_state :allin
  aasm_state :pass
  aasm_state :absent
  aasm_state :pass_away
  aasm_state :leave

	def fold?
		pass? or pass_away?
	end

	def away?
		absent? or pass_away?
	end

	def ready_for_next_stage?
		has_called? or fold?
	end

	aasm_event :im_allin do
		transitions :from => :active, :to => :allin
	end

	aasm_event :activate do
		transitions :from => [:active, :pass, :allin], :to => :active
		transitions :from => [:pass_away], :to => :absent
	end

	aasm_event :fold do
		transitions :from => :active, :to => :pass
		transitions :from => :absent, :to => :pass_away
	end

	aasm_event :back_here do
		transitions :from => :absent, :to => :active
		transitions :from => :pass_away, :to => :pass
	end

	aasm_event :lose do
		transitions :from => [:pass, :allin, :pass_away] , :to => :leave, :guard => lambda {|player| player.has_empty_stack?}
	end

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

  def has_called?
    0 == for_call
  end

  def must_call?
    for_call > 0
  end

  def has_empty_stack?
    0 == stack
  end

  def rank
    if pass?
      -1
    else
      hand.to_i
    end
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
