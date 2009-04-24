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
		transitions :from => :on_river, :to => :on_preflop, :guard => lambda {|game| 1 < game.players.count}
		transitions :from => :on_river, :to => :finished
	end

  self.inheritance_column = "class"

  serialize :deck, Poker::Deck
  serialize :flop, Poker::Hand
  serialize :turn, Poker::Hand
  serialize :river, Poker::Hand

	include BlindSystem
	include DistributionSystem
  
  belongs_to :type, :class_name => 'GameType'
  has_many :players, :conditions => ['status <> ?', Player::STATUS[:leave]]
  has_many :users, :through => :players
  has_many :actions, :class_name => 'PlayerActions::Action'

  def minimal_bet
    blind_size * type.bet_multiplier
  end

	def started?
		on_preflop? or on_flop? or on_turn? or on_river?
	end

  def pot
    players.inject(0){|sum, player| sum + player.in_pot}
  end

  def full_of_players?
		reload
    players_count == type.max_players
  end

	def empty_players_set?
		reload
		0 == players_count
	end

  def wait_action_from user
    Player.find_by_id_and_user_id active_player_id, user.id
  end

	def active_player_sit
		player = players.select{|p| active_player_id == p.id}.first
		player.sit if player
	end

	def first_free_sit
		(0...(type.max_players)).to_a.select{|sit| !players.map(&:sit).include?(sit)}.min
	end

  def next_active_player_id
    current_player = Player.find self.active_player_id
    player = get_first_player_from current_player.sit, :out => :self
    while !player.active? and player != current_player
			if player.absent_and_must_call?
				player.fold!
			elsif player.absent?
				player.auto_check!
			end
      player = get_first_player_from player.sit, :out => :self
    end
    update_attribute :active_player_id, player.id
  end

	def active_player_away?
		action_time_left <= 0
	end

	def action_time_left
		unless actions.empty?
			actions.first(:order => 'id DESC').time_left
		else
			# начало отсчета - старт игры или новая раздача 
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

  private

  def one_winner?
    1 == players.select{|p| !p.fold?}.length
  end

  # Ищет первое не пустое место начиная с sit в направлении :direction
  def get_first_player_from sit, params = {}
		players.reload
    params[:out] ||= :id
    params[:direction] ||= :asc
    conditions = case params[:direction]
    when :asc
      {:first => ['sit > ?', sit], :order => 'sit ASC'}
    else
      {:first => ['sit < ?', sit], :order => 'sit DESC'}
    end
    player = players.first :conditions => conditions[:first], :order => conditions[:order]
    player = players.first(:order => conditions[:order]) unless player
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
			:client_sit => players.client_sit(for_user_id).first.sit,
			:time_for_action => type.time_for_action,
			:max_players => type.max_players,
			:start_stack => type.start_stack,
			:players_to_load => players.map(&:build_synch_data)
		}
	end

	def init_data_after_start for_user_id
		{
			:blind_position => blind_position,
			:small_blind_position => small_blind_position,
			:current_ber => current_bet,
			:next_level_time => next_level_time,
			:active_player_id => active_player_id,
			:last_action_id => (actions.any? ? actions.sort_by(&:created_at).last.id : nil),
			:action_time_left => action_time_left,
			:flop  => (flop.nil? ? flop.to_s : nil),
			:turn  => (turn.nil? ? turn.to_s : nil),
			:river => (river.nil? ? river.to_s : nil),
			:players_to_load => players.map{|p| p.build_synch_data(:after_start_game, for_user_id)}
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
			:current_ber => current_bet,
			:nexl_level_time => next_level_time,
			:client_hand => current_player(for_user_id).hand.to_s,
			:action_time_left => action_time_left,
			:players_to_load => players.map{|p| p.build_synch_data(:on_distribution)}
		}
	end

	def data_for_synch_on_start for_user_id
		{
			:blind_position => blind_position,
			:small_blind_position => small_blind_position,
			:next_level_time => next_level_time,
			:current_ber => current_bet,
			:active_player_id => active_player_id,
			:action_time_left => action_time_left,
			:client_hand => current_player(for_user_id).hand.to_s
		}
	end

  def data_for_synch_on_next_stage
    {
      :status => status,
      :flop => flop,
      :turn => turn,
      :river => river
    }
  end

	def give_prize_to_winners
		
	end
end
