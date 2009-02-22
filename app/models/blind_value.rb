class BlindValue < ActiveRecord::Base

  belongs_to :game_type

  validates_presence_of :value, :game_type_id, :level

end
