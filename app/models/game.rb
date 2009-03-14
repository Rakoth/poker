class Game < ActiveRecord::Base

  self.inheritance_column = "class"

  belongs_to :type, :class_name => 'GameType'
  has_many :players, :dependent => :delete_all
  has_many :users, :through => :players
  has_many :actions

  def minimal_bet
    blind_value * type.bet_multiplier
  end

  def add_player user
    player = players.create(
      :user => user,
      :sit => players_count,
      :stack => type.start_stack
    ) if wait? and user.can_join?(self)
    if player
      max_players = type.max_players
      self.reload
      start if players_count == max_players
    end
    player
  end

  def wait?
    'wait' == status
  end

  def wait_action_from user
    Player.find_by_id_and_user_id turn, user.id
  end

  def next_level
    if new_blind_size = type.get_blind_size(blind_level + 1)
      update_attributes(
        :blind_level => blind_level + 1,
        :blind_size => new_blind_size.value,
        :ante => new_blind_size.ante,
        :next_level_time => Time.now + type.change_level_time.minutes
      )
    else
      update_attribute(:next_level_time, nil)
    end if next_level_time and Time.now >= next_level_time
  end

  def start
    random_blind_sit = rand(type.max_players)
    params = {
      :status => :start,
      :next_level_time => Time.now + type.change_level_time.minutes,
      :blind => random_blind_sit,
      :turn => get_first_player_from(random_blind_sit)
    }
    update_attributes(params)
    distribution
  end

  def next_turn
    current_player = Player.find self.turn
    player_id = get_first_player_from current_player.sit
    update_attribute :turn, player_id
  end

  def get_first_player_from sit, params = {:out => :id, :direction => :asc}
    players_set = active_players
    conditions = case params[:direction]
    when :asc
      {:first => ['sit > ?', sit], :second => 'sit >= 0'}
    when :desc
      {:first => ['sit < ?', sit], :second => ['sit < ?', type.max_players]}
    end
    player = players_set.find(:first, :conditions => conditions[:first])
    player = players_set.find(:first, :conditions => conditions[:second]) unless player
    player.send(params[:out])
  end

  def active_players
    players.find_all{ |player| player.active? }
  end

  def distribution # раздача карт
    take_blinds
    #TODO генерация карт
  end

  def take_blinds
    update_attribute(:bank, blind_size * 1.5 + ante * players_count)
    players.each do |player|
      #TODO use take_chips
      params = {
        :stack => player.stack - ante,
        :for_call => 2
      }
      player.update_attributes(params)
    end
  end

end
