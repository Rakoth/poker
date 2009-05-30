require 'cards/poker'

class Game < ActiveRecord::Base
  include AASM
  aasm_initial_state :waited
  aasm_column :status

  aasm_state :waited, :exit => :init_blinds_system!
  aasm_state :on_preflop, :enter => :start_distribution!
  aasm_state :on_flop, :enter => :deal_flop!
  aasm_state :on_turn, :enter => :deal_turn!
  aasm_state :on_river, :enter => :deal_river!#, :exit => :final_distribution!
  aasm_state :finished, :enter => :give_prize_to_winners

  aasm_event :start do
    transitions :from => :waited, :to => :on_preflop
  end

	aasm_event :show_flop do
		transitions :from => :on_preflop, :to => :on_flop
	end

	aasm_event :show_turn do
		transitions :from => :on_flop, :to => :on_turn
	end

	aasm_event :show_river do
		transitions :from => :on_turn, :to => :on_river
	end

	aasm_event :new_distribution do
		transitions :from => [:on_preflop, :on_flop, :on_turn, :on_river], :to => :on_preflop, :guard => lambda {|game| 1 < game.players.size	}
		transitions :from => [:on_preflop, :on_flop, :on_turn, :on_river], :to => :finished
	end

	STATUS = {:waited => 'waited'}
	PAUSE_TYPE = {
		:by_away => 'by_away',
		:by_request => 'by_request'
	}

	named_scope :waited, :conditions => { :status => STATUS[:waited] }, :include => [:type]

  self.inheritance_column = "class"

  serialize :deck, Poker::Deck
  serialize :flop, Poker::Hand
  serialize :turn, Poker::Hand
  serialize :river, Poker::Hand
  serialize :previous_flop, Poker::Hand
  serialize :previous_turn, Poker::Hand
  serialize :previous_river, Poker::Hand

	include BlindSystem
	include DistributionSystem
  
  belongs_to :type, :class_name => 'GameType'
  has_many :players, :conditions => ['status <> ?', Player::STATUS[:leave]]
  has_many :users, :through => :players
  has_many :actions, :class_name => 'PlayerActions::Action'
  has_many :current_distribution_actions, :class_name => 'PlayerActions::Action', :conditions => ['deleted = ?', false]
	has_many :log_messages

	def active_player
		@active_player ||= Player.find active_player_id
	end

	def active_player= player
		@active_player = player
		update_attribute :active_player_id, player.id
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

	def pause_by_away!
		update_attribute :paused, PAUSE_TYPE[:by_away]
	end

	def resume!
		update_attribute :paused, nil
	end

  def pot
    players.inject(0){|sum, player| sum + player.in_pot}
  end

  def minimal_bet
    blind_size * type.bet_multiplier
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
#   player = get_first_player_from current_player.sit, :out => :self
#		while player.fold?# and player != current_player
#			 player = get_first_player_from player.sit, :out => :self
#		end
		return player
	end

	def action_time_left
		unless current_distribution_actions.empty?
			current_distribution_actions.first(:order => 'id DESC').time_left
		else
			# начало отсчета - старт игры или новая раздача или отжим паузы
			(type.time_for_action - (Time.now - updated_at).to_i)
		end
	end

	def build_synch_data type = :init, for_user_id = nil
		case type
		when :init
			data_for_init_client for_user_id
		when :on_start
			data_for_synch_on_start for_user_id
		when :on_distribution
			data_for_synch_on_distribution for_user_id
    when :on_next_stage
      data_for_synch_on_next_stage
		else
			raise ArgumentError, 'Unexpected type for building game data: ' + type.to_s
		end
	end

	def current_player user_id
		players.find_by_user_id user_id
	end

  def one_winner?
    1 == players.select{|p| !p.fold?}.length
  end

	def allin_and_call?
		players.select{|p| p.must_call? and !p.fold? }.length == 0 and players.select{|p| !p.fold? and !p.allin? }.length <= 1
	end

  private

  # Ищет первое не пустое место начиная с sit в направлении :direction
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

	def data_for_init_client for_user_id
		game_copy = init_data_common for_user_id
		game_copy.merge! init_data_after_start(for_user_id) unless waited?
		game_copy
	end

	def init_data_common for_user_id
		{
			:id => id,
			:status => status,
			:blind_size => blind_size,
			:ante => ante,
			:client_sit => current_player(for_user_id).sit,
			:time_for_action => type.time_for_action,
			:max_players => type.max_players,
			:start_stack => type.start_stack,
			:players_to_load => players.map(&:build_synch_data),
			:last_message_id => log_messages.any? ? log_messages.first(:order => 'id DESC').id : 0
		}
	end

	def init_data_after_start for_user_id
		{
			:blind_position => blind_position,
			:small_blind_position => small_blind_position,
			:current_bet => current_bet,
			:next_level_time => next_level_time,
			:active_player_id => active_player_id,
			:last_action_id => (actions.any? ? actions.sort_by(&:created_at).last.id : nil),
			:action_time_left => action_time_left,
			:flop_to_load  => (flop.nil? ? flop.to_s : nil),
			:turn_to_load  => (turn.nil? ? turn.to_s : nil),
			:river_to_load => (river.nil? ? river.to_s : nil),
			:players_to_load => players.map{|p| p.build_synch_data(:after_start_game, for_user_id)},
			:paused => paused
		}
	end

	def data_for_synch_on_distribution for_user_id
		{
			:status => status,
			:active_player_id => active_player_id,
			:blind_position => blind_position,
			:small_blind_position => small_blind_position,
			:blind_size => blind_size,
			:ante => ante,
			:current_bet => current_bet,
			:next_level_time => next_level_time,
			:client_hand => (current_player(for_user_id) ? current_player(for_user_id).hand.to_s : nil),
			:action_time_left => action_time_left,
			:players_to_load => players.map{|p| p.build_synch_data(:on_distribution)},
			:previous_final => build_previous_final,
			:paused => paused
		}
	end

	def data_for_synch_on_start for_user_id
		{
			:blind_position => blind_position,
			:small_blind_position => small_blind_position,
			:next_level_time => next_level_time,
			:current_bet => current_bet,
			:active_player_id => active_player_id,
			:action_time_left => action_time_left,
			:client_hand => current_player(for_user_id).hand.to_s
		}
	end

  def data_for_synch_on_next_stage
    {
      :status => status,
      :flop_to_load => flop.to_s,
      :turn_to_load => turn.to_s,
      :river_to_load => river.to_s
    }
  end

	def give_prize_to_winners
		#TODO
	end

	def build_previous_final
		{
			:players => players.map{|p| p.build_synch_data :previous_final},
			:flop => previous_flop.to_s,
			:turn => previous_turn.to_s,
			:river => previous_river.to_s
		}
	end
end
