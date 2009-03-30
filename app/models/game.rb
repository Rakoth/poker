class Game < ActiveRecord::Base
  include AASM
  aasm_initial_state :waited
  aasm_column :status

  aasm_state :waited, :exit => :init_blinds_system!
  aasm_state :on_preflop, :enter => :start_distribution!
  aasm_state :on_flop, :enter => :prepare_flop!
  aasm_state :on_turn, :enter => :prepare_turn!
  aasm_state :on_river, :enter => :prepare_river!, :exit => :final_distribution!
  aasm_state :finished

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
		transitions :from => :on_river, :to => :on_preflop
	end

  self.inheritance_column = "class"

	include BlindSystem
	include DistributionSystem
  
  belongs_to :type, :class_name => 'GameType'
  has_many :players, :dependent => :delete_all, :conditions => 'status NOT LIKE "leave"'
  has_many :users, :through => :players
  has_many :actions

  def minimal_bet
    blind_size * type.bet_multiplier
  end

  def bank
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

  def all_pass?
    players.select{|p| p.pass?}.length == players.count - 1
  end

  def next_active_player_id
    current_player = Player.find self.active_player_id
    player = get_first_player_from current_player.sit, :out => :self
    while !player.active? and player != current_player
      player.do_pass_away if player.away? and player.must_call?
      player = get_first_player_from player.sit, :out => :self
    end
    update_attribute :active_player_id, player.id
  end

  protected

  # Ищет первое не пустое место начиная с sit в направлении :direction
  def get_first_player_from sit, params = {}
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
      player.send(params[:out])
    end
  end
end
