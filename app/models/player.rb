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
	
	STATUS = {:leave => 'leave', :away => 'absent', :pass_away => 'pass_away'}

	named_scope :want_pause, :conditions => ['want_pause = ?', true]
	named_scope :away, :conditions => ["status IN (?, ?)", STATUS[:away], STATUS[:pass_away]]

	def fold?
		pass? or pass_away?
	end

	def away?
		absent? or pass_away?
	end

	def act_now?
		id == game.active_player_id
	end

	def ready_for_next_stage?
		fold? or (has_called? and (act_now? or !on_big_blind_and_not_do_action?))
	end

	def on_big_blind_and_not_do_action?
		sit == game.blind_position and game.current_bet == game.blind_size
	end

	def absent_and_must_call?
		absent? and must_call?
	end
	
#	def can_do_stake_and_call?
#		!fold? and !allin? and has_called?
#	end

	aasm_event :i_am_allin do
		transitions :from => :active, :to => :allin
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
		transitions :from => :absent, :to => :pass_away, :on_transition => :auto_fold!
	end
	
	# пасс по таймауту
	aasm_event :fold_on_away do
		transitions :from => :active, :to => :pass_away, :success => :do_fold_on_away!
	end

	aasm_event :back_to_game do
		transitions :from => :absent, :to => :active, :on_transition => :resume_game!
		transitions :from => :pass_away, :to => :pass, :on_transition => :resume_game!
	end

	aasm_event :lose do
		transitions :from => [:pass, :allin, :pass_away] , :to => :leave, :guard => lambda {|player| player.has_empty_stack?}
	end

	serialize :hand, Poker::Hand
	serialize :previous_hand, Poker::Hand
  
  # validates_presence_of :user_id, :game_id, :sit, :stack

  belongs_to :user
  belongs_to :game, :counter_cache => :players_count
  has_many :actions, :class_name => 'Actions::Action'

	delegate :login, :level, :to => :user

  before_create :take_user_money
	after_create :start_game, :if => lambda {|player| player.game.full_of_players?}
  before_destroy :return_user_money, :if => lambda {|player| player.game.waited?}
	after_destroy :give_prize, :unless => lambda {|player| player.game.waited?}
	after_destroy :destroy_game, :if => lambda {|player| player.game.empty_players_set?}
	
  attr_writer :persent # процент выйгрыша
	
  def persent
    @persent ||= 0
  end

  def act! params
    hash_params = {:player => self, :game => game}
    hash_params[:value] = params[:value] unless params[:value].nil?
    action = case params[:kind].to_i
		when 0:
				PlayerActions::FoldAction.new hash_params
		when 1:
				PlayerActions::CheckAction.new hash_params
		when 2:
				PlayerActions::CallAction.new hash_params
		when 3:
				PlayerActions::BetAction.new hash_params
		when 4:
				PlayerActions::RaiseAction.new hash_params
		else
			raise 'Unexpected action type in Player#act!: "' + params[:kind] + '"'
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

	def full_hand
		Poker::Hand.new hand, game.flop, game.turn, game.river
	end

	def act_on_away!
		if must_call?
			fold_on_away!
			do_fold_on_away!
		else
			check_on_away!
		end
	end

	def show_hand_to? watched_user_id
		user_id == watched_user_id or open_hand?
	end

	def open_hand?
		open_hand
	end


	def build_synch_data type = :init, for_user_id = nil
		case type
		when :init
			init_data
		when :after_start_game
			init_data_after_start_game for_user_id
		when :on_distribution
			init_data_on_distribution
		when :previous_final
			data_to_show_final
		else
			raise ArgumentError, 'Unexpected type for building player data: ' + type.to_s
		end
	end

	def auto_check!
		PlayerActions::AutoCheckAction.new(:player => self, :game => game).execute
	end

	private
	
	def init_data
		{
			:id => id,
			:login => login,
			:sit => sit
		}
	end

	def init_data_after_start_game for_user_id
		data = init_data
		data.merge!(init_data_on_distribution).merge!(:hand_to_load => (show_hand_to?(for_user_id) ? hand.to_s : nil))
		return data
	end

	def init_data_on_distribution
		{
			:sit => sit,
			:status => status,
			:stack => stack,
			:for_call => for_call,
			:in_pot => in_pot,
		}
	end

	def data_to_show_final
		{
			:sit => sit,
			:hand => previous_hand.to_s
		}
	end
	
	def give_prize
		#TODO отдать выйгранные деньги юзеру
	end
  
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

	def auto_fold!
		PlayerActions::AutoFoldAction.new(:player => self, :game => game).execute
	end

	def do_fold_on_away!
		PlayerActions::TimeoutFoldAction.new(:player => self, :game => game).execute
	end

	def check_on_away!
		PlayerActions::TimeoutCheckAction.new(:player => self, :game => game).execute
	end

	def resume_game!
		game.resume! if game.paused_by_away?
	end

end
