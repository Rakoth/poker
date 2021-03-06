class Player < ActiveRecord::Base
	include AASM
  aasm_column :status
	aasm_initial_state :active

  aasm_state :active
  aasm_state :allin
  aasm_state :pass
  aasm_state :absent
  aasm_state :pass_away
	aasm_state :lose, :enter => :take_prize
  aasm_state :leave_now
  aasm_state :leave
	
	STATUS = {
		:active => 'active',
		:allin => 'allin',
		:pass => 'pass',
		:leave => 'leave',
		:away => 'absent',
		:pass_away => 'pass_away',
		:leave_now => 'leave_now',
		:lose => 'lose'
	}
	LONG_AWAY = 5

	named_scope :want_pause, :conditions => {:want_pause => true}
	named_scope :away, :conditions => {:status => [STATUS[:away], STATUS[:pass_away]]}
	named_scope :active, :conditions => {:status => [STATUS[:active], STATUS[:allin], STATUS[:pass]]}

	def fold?
		pass? or pass_away?
	end

	def away?
		absent? or pass_away?
	end

	def ready_for_next_stage?
		act_in_this_round? or fold?
	end

	def act_in_this_round?
		act_in_this_round
	end

	def absent_and_must_call?
		absent? and must_call?
	end

	aasm_event(:i_am_allin) { transitions :from => [:active, :absent], :to => :allin }
	# восстанавливает состояние по умолчанию перед новой раздачей
	aasm_event :activate do
		transitions :from => [:active, :pass, :allin], :to => :active
		transitions :from => [:pass_away, :absent], :to => :absent
	end
	aasm_event :fold do
		# игрок сам сделал пасс
		transitions :from => :active, :to => :pass
		# автопасс для отошедшего ранее игрока
		transitions :from => :absent, :to => :pass_away
	end
	# пасс по таймауту - ставим статус отошел
	aasm_event(:away_on_fold) { transitions :from => :active, :to => :pass_away }
	# чек по таймауту - ставим статус отошел
	aasm_event(:away_on_check) { transitions :from => :active, :to => :absent }
	aasm_event :back_to_game do
		transitions :from => :absent, :to => :active
		transitions :from => :pass_away, :to => :pass
	end
	aasm_event(:lose) { transitions :from => [:allin, :pass_away, :absent], :to => :lose }
	aasm_event(:prepare_left_game) { transitions :from => :lose , :to => :leave_now }
	aasm_event(:left_game) { transitions :from => :leave_now , :to => :leave }
	
	include SerializeCards
	serialize_cards :hand
	serialize_cards :previous_hand

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
		PlayerActions::Base.execute_player_action kind, action_params
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


	def auto_check!
		execute_auto_action! PlayerActions::Base::AUTO_CHECK
	end

	def auto_fold!
		execute_auto_action! PlayerActions::Base::AUTO_FOLD
	end

	def fold_on_away!
		execute_auto_action! PlayerActions::Base::TIMEOUT_FOLD
	end

	def check_on_away!
		execute_auto_action! PlayerActions::Base::TIMEOUT_CHECK
	end

	def take_prize
		update_attribute :place, game.players.count
		game.type.give_prize_to_winner self
	end

	def long_away? how_long = nil
		away_from < Time.now - (how_long.nil? ? LONG_AWAY : how_long).minutes
	end

	def small_stack?
		stack <= game.blind_size
	end

	def loser?
		has_empty_stack? or
			(away? and (long_away? or small_stack? or (game.one_active_player? and long_away?(2))))
	end
	
	private

	def execute_auto_action! kind
		PlayerActions::Base.execute_auto_action kind, :player => self, :game => game
	end
	
	def return_user_money
		game.type.return_payment user
	end

	def take_user_money
		game.type.get_payment user
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
