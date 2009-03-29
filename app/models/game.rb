class Game < ActiveRecord::Base

  self.inheritance_column = "class"

  STATUS = {:wait => 'wait', :start => 'start'}
  
  belongs_to :type, :class_name => 'GameType'
  has_many :players, :dependent => :delete_all
  has_many :users, :through => :players
  has_many :actions

  def minimal_bet
    blind_size * type.bet_multiplier
  end

  def bank
    players.inject(0){|sum, player| sum + player.in_pot}
  end

  def small_blind_size
    blind_size / 2
  end

  attr_reader :small_blind_position

  def small_blind_position
    @small_blind_position ||= get_first_player_from blind_position, :out => :sit, :direction => :desc
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
    Player.find_by_id_and_user_id active_player_id, user.id
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
      :active_player_id => get_first_player_from(random_blind_sit)
    }
    update_attributes(params)
    new_distribution
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

  def active_players
    players.find_all{ |player| player.active? }
  end

  def next_stage
    if players.all? { |p| p.has_called? or p.pass? }
      goto_next_stage
    else
      final_distribution if all_pass?
    end
  end

  def goto_next_stage
    if flop.nil?
      #do_flop
    elsif !flop.nil? and turn.nil?
      #do_turn
    elsif !flop.nil? and !turn.nil? and river.nil?
      #do_river
    else
      final_distribution
    end
  end

  def new_distribution # раздача
    before_distribution
    next_level
    take_blinds!
    #TODO генерация карт
  end

  def final_distribution
    groups = players.group_by(&:rank).sort_by{ |g| g[0] }.reverse.map do |g|
      group, max = g[1], 0
      general_in_pot = group.inject(0){|s, p| s + p.in_pot}
      if general_in_pot > 0
        max = group.first.in_pot
        group.map! do |player|
          max = player.in_pot if player.in_pot > max
          player.persent = ((100 * player.in_pot / general_in_pot).to_f.round) / 100
          player
        end
      end
      [max, group]
    end
    calculated_groups = groups.map do |g|
      max, chips_sum = g[0], 0
      groups.map! do |group|
        group[1].map! do |player|
          if player.in_pot > max
            chips_sum += max
            player.in_pot -= max
          else
            chips_sum += player.in_pot
            player.in_pot = 0
          end
          player
        end
        group
      end
      g[1].map{ |player| player.stack += (chips_sum * player.persent).round; player}
    end
    calculated_groups.flatten.each{ |player| player.save}
  end
#  def ending_distribution
#    groups = self.group_players
#    groups.each_index do |group|
#      general_in_pot = groups[group].inject(0){|s, p| s + p[:in_pot]}
#      if general_in_pot > 0
#        max = groups[group].first[:in_pot]
#        groups[group].each_index{|player|
#          max = groups[group][player][:in_pot] if groups[group][player][:in_pot] > max
#          groups[group][player][:persent] = (groups[group][player][:in_pot] / general_in_pot).to_f.round(2)
#        }
#        chips_summ = 0
#        groups.each_index { |i|
#          groups[i].each_index { |p|
#            if groups[i][p][:in_pot] > max
#              chips_summ += max
#              groups[i][p][:in_pot] -= max
#            else
#              chips_summ += groups[i][p][:in_pot]
#              groups[i][p][:in_pot] = 0
#            end
#          }
#        }
#        groups[group].each_index { |player|
#          groups[group][player][:stack] += (chips_summ * groups[group][player][:persent]).round
#        }
#      end
#    end
#    players_hash = {}
#    groups.flatten!.each do |player|
#      players_hash[player[:id]] = {
#        :stack => player[:stack]
#      }
#    end
#    players.each do |player|
#      player.update_attributes(players_hash[player.id])
#    end
#  end

#  def group_players
#    temp_players = players.map{|p| {
#        :id => p.id,
#        :hand => p.hand,
#        :in_pot => p.in_pot,
#        :stack => p.stack
#      } if p.in_pot > 0
#    }.sort_by{|p| p[:hand]}.reverse
#    groups = []
#    group =[]
#    temp_players.each_index do |i|
#      if 0 == i or temp_players[i][:hand] == temp_players[i-1][:hand]
#        group.push temp_players[i]
#      else
#        groups.push group
#        group = [temp_players[i]]
#      end
#    end
#    groups.push group
#  end

  def all_pass?
    players.select{|p| p.pass?}.length == players.count - 1
  end

  protected

  def take_blinds!
    players.map{ |player| player.give_chips!(ante)} if ante > 0
    blind = players.select { |player| player.sit == blind_position }.first.give_chips! blind_size
    Player.update_all "for_call = for_call + #{blind}", ["game_id = ? AND in_pot <= ?", self.id, ante]
    players.select { |player| player.sit == small_blind_position }.first.give_chips! small_blind_size
    update_attribute :current_bet, blind
  end

  def before_distribution
    update_attributes :current_bet => 0
    players.each do |player|
      if 0 == player.stack
        player.destroy
      else
        players_params = {:in_pot => 0, :for_call => 0}
        if player.pass_away?
          players_params[:state] = Player::STATE[:away]
        else
          players_params[:state] = Player::STATE[:active] unless player.away?
        end
        player.update_attributes players_params
      end
    end
  end

end
