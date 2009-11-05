require 'cards/poker'

class Game < ActiveRecord::Base
  include AASM
  aasm_initial_state :waited
  aasm_column :status

  aasm_state :waited, :exit => :init_blinds_system!
  aasm_state :on_preflop, :enter => :start_distribution!
  aasm_state :on_flop, :enter => :deal_flop!
  aasm_state :on_turn, :enter => :deal_turn!
  aasm_state :on_river, :enter => :deal_river!
  aasm_state :finished, :enter => :give_prize_to_last_winner

  aasm_event(:start) { transitions :from => :waited, :to => :on_preflop }
	aasm_event(:show_flop) { transitions :from => :on_preflop, :to => :on_flop }
	aasm_event(:show_turn) { transitions :from => :on_flop, :to => :on_turn }
	aasm_event(:show_river) { transitions :from => :on_turn, :to => :on_river }
	aasm_event :new_distribution do
		transitions :from => [:on_preflop, :on_flop, :on_turn, :on_river], :to => :on_preflop, :guard => lambda {|game| 1 < game.players.size	}
		transitions :from => [:on_preflop, :on_flop, :on_turn, :on_river], :to => :finished
	end

	STATUS = {
		:waited => 'waited',
		:on_preflop => 'on_preflop',
		:on_flop => 'on_flop',
		:on_turn => 'on_turn',
		:finished => 'finished'
	}
	PAUSE_TYPE = {
		:by_away => 'by_away',
		:by_request => 'by_request'
	}

	named_scope :current, :conditions => ['`games`.`status` <> ?', STATUS[:finished]], :include => [:type]
	named_scope :waited, :conditions => { :status => STATUS[:waited] }, :include => [:type]
	named_scope :finished, :conditions => { :status => STATUS[:finished] }, :include => [:type]
	named_scope :started, :conditions => ['`games`.`status` NOT IN (?)', [STATUS[:waited], STATUS[:finished]]], :include => [:type]

  self.inheritance_column = "class"

	include SerializeCards
	serialize_cards :deck, Poker::Deck
	serialize_cards :flop
	serialize_cards :turn
	serialize_cards :river
	serialize_cards :previous_flop
	serialize_cards :previous_turn
	serialize_cards :previous_river

  def ante
    self[:ante] or 0
  end
  
	include BlindSystem
	include DistributionSystem
  
  belongs_to :type, :class_name => 'GameTypes::Base'

  has_many :all_players, :class_name => 'Player', :dependent => :destroy
  has_many :players, :conditions => ['status NOT IN (?)', [Player::STATUS[:lose], Player::STATUS[:leave], Player::STATUS[:leave_now]]]
	has_many :previous_distribution_players, :class_name => 'Player', :conditions => ['status <> ?', Player::STATUS[:leave]]
	has_many :leave_now_players, :class_name => 'Player', :conditions => {:status => Player::STATUS[:leave_now]}
	has_many :lose_players, :class_name => 'Player', :conditions => {:status => Player::STATUS[:lose]}
  has_many :users, :through => :players
  has_many :actions, :class_name => 'PlayerActions::Base', :dependent => :destroy
  has_many :current_distribution_actions, :class_name => 'PlayerActions::Base', :conditions => ['deleted = ?', false]
	has_many :log_messages, :dependent => :destroy

	def active_player
		@active_player ||= players.find active_player_id
	end

	def active_player= player
		@active_player = player
		update_attribute :active_player_id, player.id
	end

	def show_previous_final?
		!previous_flop.nil?
	end

	def started?
		on_preflop? or on_flop? or on_turn? or on_river?
	end

  def full_of_players?
		reload
    players_count == type.max_players
  end

	def empty_players_set?
		reload
		0 == players_count
	end

	def active_player_away?
		action_time_left <= 0
	end

	def all_away?
		players.away.count == players_count
	end

	def all_want_pause?
		players.want_pause.count == players_count
	end

	def paused?
		paused != nil
	end

	def paused_by_away?
		PAUSE_TYPE[:by_away] == paused
	end

	def paused_by_request?
		PAUSE_TYPE[:by_request] == paused
	end

	def one_active_player?
		1 == players.active.count
	end

	def pause_by_away!
		update_attribute :paused, PAUSE_TYPE[:by_away]
	end

	def resume! first_active_player
		if paused_by_away?
			update_attribute :paused, nil
			if active_player != first_active_player
				active_player.auto_fold!
			end
		end
	end

	def last_log_message_id
		log_messages.any? ? log_messages.last(:order => 'created_at').id : 0
	end

	def last_player_action_id
		actions.any? ? actions.last(:order => 'created_at').id : 0
	end

  def pot
		waited? ? 0 : players.sum(:in_pot)
  end

  def minimal_bet
    blind_size
  end

  def wait_action_from user
    Player.find_by_id_and_user_id active_player_id, user.id
  end

	def first_free_sit
		(0...(type.max_players)).to_a.select{|sit| !players.map(&:sit).include?(sit)}.min
	end

	def next_player
    player = active_player
		begin
			player = get_first_player_from player.sit, :out => :self
		end while player.fold?
		return player
	end

	def action_time_left
		time = unless current_distribution_actions.empty?
			current_distribution_actions.first(:order => 'id DESC').time_left
		else
			# начало отсчета - старт игры или новая раздача или отжим паузы
			(type.time_for_action - (Time.now - updated_at).to_i)
		end
		time < 0 ? 0 : time
	end

	def current_player user_or_user_id
		user_id = user_or_user_id.is_a?(User) ? user_or_user_id.id : user_or_user_id
		players.find_by_user_id user_id
	end

  def one_winner?
    1 == players.select{|p| !p.fold?}.length
  end

	def allin_and_call?
		0 == players.select{|p| p.must_call? and !p.fold? and !p.allin?}.length and players.select{|p| !p.fold? and !p.allin? }.length <= 1
	end

	def pay_for_game user
		user.purse.pay type.get_payment
	end

	def return_payment user
		user.purse.receive type.get_payment
	end

  private

  # Ищет первое не пустое место начиная с sit в направлении :direction
	# всегда основывается на состоянии игроков в базе данных
  def get_first_player_from sit, params = {}
		players.reload
    params[:out] ||= :id
    params[:direction] ||= :asc
    options = case params[:direction]
    when :asc
      {:first => ['sit > ?', sit], :order => 'sit ASC'}
    else
      {:first => ['sit < ?', sit], :order => 'sit DESC'}
    end
    player = players.first :conditions => options[:first], :order => options[:order]
    player = players.first(:order => options[:order]) unless player
    if :self == params[:out]
      player
    else
      player.send params[:out]
    end
  end

	def give_prize_to_last_winner
		players.first.take_prize
	end
end
