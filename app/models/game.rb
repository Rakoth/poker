class Game < ActiveRecord::Base

  self.inheritance_column = "class"

  STATUS = {:wait => 'wait', :start => 'start'}
  
  belongs_to :type, :class_name => 'GameType'
  has_many :players, :dependent => :delete_all
  has_many :users, :through => :players
  has_many :actions

  def minimal_bet
    blind_value * type.bet_multiplier
  end

  def small_blind_size
    blind_size / 2
  end

  def small_blind_position
    get_first_player_from blind_position, :out => :sit, :direction => :desc
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
    STATUS[:wait] == status
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
      :status => STATUS[:start],
      :next_level_time => Time.now + type.change_level_time.minutes,
      :blind_position => random_blind_sit,
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

  def get_first_player_from sit, params = {} # Ищет первое не пустое место начиная с sit в направлении :direction
    params[:out] ||= :id
    params[:direction] ||= :asc
    conditions = case params[:direction]
    when :asc
      first_sit = players.map{ |p| p.sit }.min
      {:first => ['sit > ?', sit], :second => ['sit = ?', first_sit]}
    else
      last_sit = players.map{ |p| p.sit }.max
      {:first => ['sit < ?', sit], :second => ['sit = ?', last_sit]}
    end
    player = players.first :conditions => conditions[:first]
    player = players.first(:conditions => conditions[:second]) unless player
    player.send(params[:out])
  end

  def active_players
    players.find_all{ |player| player.active? }
  end

  def distribution # раздача
    take_blinds
    #TODO генерация карт
  end

  def take_blinds
    update_attribute(:bank, blind_size * 1.5 + ante * players_count)
    players.each do |player|
      player.take_ante if ante > 0
      player.take_chips blind_size if blind_position == player.sit
      player.take_chips small_blind_size if small_blind_position == player.sit
    end
  end

  def completion_distribution
    (players.sort_by {|p| p.hand}).each { |player|
      if player.in_pot > 0
        player.stack += players.inject(0){ |result, elem|
          if elem.in_pot > 0
            if elem.in_pot >= player.in_pot
              elem.in_pot -= player.in_pot
              result + player.in_pot
            else
              elem.in_pot = 0
              result + elem.in_pot
            end
          else
            result
          end
        }
      end
    }
    self.save
  end
  
end
