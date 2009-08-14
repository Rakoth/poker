require 'cards/poker'

class Player < ActiveRecord::Base
  include AASM
  aasm_initial_state :active
  aasm_column :status

  aasm_state :active
  aasm_state :allin
  aasm_state :pass
  aasm_state :absent#, :success => :act_on_away!
  aasm_state :pass_away
  aasm_state :leave
  aasm_state :leave_now
	
	STATUS = {:leave => 'leave', :away => 'absent', :pass_away => 'pass_away', :leave_now => 'leave_now'}

	named_scope :want_pause, :conditions => {:want_pause => true}
	named_scope :away, :conditions => {:status => [STATUS[:away], STATUS[:pass_away]]}

	def fold?
		pass? or pass_away?
	end

	def away?
		absent? or pass_away?
	end

#	def act_now?
#		id == game.active_player_id
#	end

	def ready_for_next_stage?
		act_in_this_round? or fold?
	end

	def act_in_this_round?
		act_in_this_round
	end

	def absent_and_must_call?
		absent? and must_call?
	end

	aasm_event :i_am_allin do
		transitions :from => [:active, :absent], :to => :allin
	end

	# восстанавливает состояние по умолчанию перед новой раздачей
	aasm_event :activate do
		transitions :from => [:active, :pass, :allin], :to => :active
		transitions :from => [:pass_away, :absent], :to => :absent
	end

	aasm_event :fold do
		# игрок сам сделал пасс
		transitions :from => :active, :to => :pass
		#transitions :from => :pass_away, :to => :pass_away
		# автопасс для отошедшего ранее игрока
		transitions :from => :absent, :to => :pass_away #, :on_transition => :auto_fold!
	end
	
	# пасс по таймауту - ставим статус отошел
	aasm_event :away_on_fold do
		transitions :from => :active, :to => :pass_away
	end

	# чек по таймауту - ставим статус отошел
	aasm_event :away_on_check do
		transitions :from => :active, :to => :absent
	end

	aasm_event :back_to_game do
		transitions :from => :absent, :to => :active
		transitions :from => :pass_away, :to => :pass
	end

	aasm_event :lose do
		transitions :from => :allin , :to => :leave_now #, :guard => lambda {|player| player.has_empty_stack?}
	end

	aasm_event :left_game do
		transitions :from => :leave_now , :to => :leave
	end

	serialize :hand, Poker::Hand
	serialize :previous_hand, Poker::Hand

  belongs_to :user
  belongs_to :game, :counter_cache => true
  has_many :actions, :class_name => 'PlayerActions::Action'

	delegate :login, :level, :to => :user

  before_create :take_user_money
	after_create :start_game, :if => lambda {|player| player.game.full_of_players?}
  before_destroy :return_user_money, :if => lambda {|player| player.game.waited?}
	after_destroy :destroy_game, :if => lambda {|player| player.game.empty_players_set?}
	before_save :calculate_winning, :unless => lambda {|player| player.previous_stack.nil? }

	attr_accessor :previous_stack
  attr_writer :persent # процент выйгрыша
	
  def persent
    @persent ||= 0
  end

	def act! params
		kind = params[:kind].to_i
		action_params = {:player => self, :game => game}
		action_params[:value] = params[:value] unless params[:value].nil?
		PlayerActions::Action.execute_player_action kind, action_params
	end

	def has_acted!
		update_attribute :act_in_this_round, true
	end

	def has_called?
		0 == for_call
	end

	def must_call?
		0 < for_call
	end

	def has_empty_stack?
		0 == stack
	end

	def full_hand
		Poker::Hand.new hand, game.flop, game.turn, game.river
	end

	def act_on_away!
		if must_call?
			fold_on_away!
		else
			check_on_away!
		end
	end

	def show_hand_to? watched_user_id
		user_id == watched_user_id
	end

#	def build_synch_data type = :init, for_user_id = nil
#		case type
#		when :init
#			init_data
#		when :after_start_game
#			init_data_after_start_game for_user_id
#		when :on_distribution
#			init_data_on_distribution
#		when :previous_final
#			data_to_show_final
#		else
#			raise ArgumentError, 'Unexpected type for building player data: ' + type.to_s
#		end
#	end

	def auto_check!
		PlayerActions::Action.execute_auto_action PlayerActions::Action::AUTO_CHECK, :player => self, :game => game
	end

	def auto_fold!
		PlayerActions::Action.execute_auto_action PlayerActions::Action::AUTO_FOLD, :player => self, :game => game
	end

	def fold_on_away!
		PlayerActions::Action.execute_auto_action PlayerActions::Action::TIMEOUT_FOLD, :player => self, :game => game
	end

	def check_on_away!
		PlayerActions::Action.execute_auto_action PlayerActions::Action::TIMEOUT_CHECK, :player => self, :game => game
	end

	private
	
#	def init_data
#		{
#			:id => id,
#			:login => login,
#			:sit => sit
#		}
#	end
#
#	def init_data_after_start_game for_user_id
#		data = init_data
#		data.merge!(init_data_on_distribution).merge!(:hand_to_load => (show_hand_to?(for_user_id) ? hand.to_s : nil))
#		return data
#	end
#
#	def init_data_on_distribution
#		{
#			:sit => sit,
#			:status => status,
#			:stack => stack,
#			:for_call => for_call,
#			:in_pot => in_pot,
#			:previous_win => previous_win,
#			:act_in_this_round => act_in_this_round
#		}
#	end
#
#	def data_to_show_final
#		{
#			:sit => sit,
#			:hand => previous_hand.to_s
#		}
#	end
	
	def return_user_money
		user.update_attribute(:cash, user.cash + game.type.pay_for_play)
	end

	def take_user_money
		user.update_attribute(:cash, user.cash - game.type.pay_for_play)
	end

	def destroy_game
		game.destroy
	end

	def start_game
		game.start!
	end

	def calculate_winning
		self.previous_win = stack - previous_stack
	end

end
