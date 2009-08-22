class BlindValue < ActiveRecord::Base
  belongs_to :game_type, :class_name => 'GameTypes::Base'
  validates_presence_of :value, :level
end
